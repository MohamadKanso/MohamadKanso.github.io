document.documentElement.classList.add("js-ready");

const revealStaticFallback = () => document.documentElement.classList.remove("js-ready");
window.addEventListener("error", revealStaticFallback, { once: true });
window.addEventListener("unhandledrejection", revealStaticFallback, { once: true });

const body = document.body;
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

function readStoredValue(key, fallback = null) {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function storeValue(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The portfolio works without persistent preferences.
  }
}

const storedMotion = readStoredValue("mk-portfolio-motion");
let effectsReduced = storedMotion === "reduced" || (storedMotion === null && motionQuery.matches);
body.classList.toggle("effects-reduced", effectsReduced);
document.documentElement.classList.toggle("effects-reduced", effectsReduced);
document.documentElement.classList.toggle("motion-forced", storedMotion === "full");

requestAnimationFrame(() => body.classList.add("is-ready"));

const paletteByMode = {
  chaos: ["#c8ff35", "#8a5cff", "#1de1ff"],
  core: ["#4052ff", "#c8ff35", "#8a5cff"],
  flow: ["#c8ff35", "#1de1ff", "#f3f0e8"],
  gate: ["#ff4f7b", "#c8ff35", "#f3f0e8"],
  scan: ["#1de1ff", "#4052ff", "#f3f0e8"],
  orbit: ["#8a5cff", "#1de1ff", "#ff4f7b"],
  shock: ["#ff7a42", "#ff4f7b", "#f3f0e8"],
  market: ["#c8ff35", "#1de1ff", "#8a5cff"],
  journal: ["#ff4f7b", "#f3f0e8", "#1de1ff"],
  kanso: ["#c8ff35", "#f3f0e8", "#1de1ff"]
};

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const parsed = Number.parseInt(value.length === 3
    ? value.split("").map((character) => character + character).join("")
    : value, 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255
  };
}

function rgba(color, alpha) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

class SignalEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: true });
    this.available = Boolean(this.context);
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.mode = "chaos";
    this.accent = "#c8ff35";
    this.particles = [];
    this.pulses = [];
    this.pointer = { x: 0, y: 0, active: false, pressed: false };
    this.reduced = effectsReduced;
    this.scrolling = false;
    this.running = false;
    this.frame = 0;
    this.lastTime = 0;
    this.lastRender = 0;
    this.resizeTimer = null;
    this.boundAnimate = this.animate.bind(this);

    if (!this.available) {
      this.canvas.hidden = true;
      return;
    }

    this.resize();
    this.bind();
    if (!this.reduced) {
      const startWhenReady = () => this.start();
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(startWhenReady, { timeout: 450 });
      } else {
        window.setTimeout(startWhenReady, 80);
      }
    }
  }

  bind() {
    window.addEventListener("resize", () => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.resize(), 120);
    }, { passive: true });

    window.addEventListener("pointermove", (event) => {
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
      this.pointer.active = true;
    }, { passive: true });

    window.addEventListener("pointerleave", () => {
      this.pointer.active = false;
      this.pointer.pressed = false;
    });

    window.addEventListener("pointerdown", (event) => {
      if (event.target.closest("a, button, input, dialog")) return;
      this.pointer.pressed = true;
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
    });

    window.addEventListener("pointerup", (event) => {
      if (!this.pointer.pressed) return;
      this.pointer.pressed = false;
      this.pulse(event.clientX, event.clientY);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.stop();
      else if (!this.reduced && !this.scrolling) this.start();
    });
  }

  resize() {
    if (!this.available) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.15 : 1.25);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const desiredCount = this.width < 680 ? 64 : this.width < 1100 ? 76 : 84;
    if (this.particles.length !== desiredCount) {
      this.particles = Array.from({ length: desiredCount }, (_, index) => this.createParticle(index));
    } else {
      this.particles.forEach((particle) => {
        particle.x = clamp(particle.x, 0, this.width);
        particle.y = clamp(particle.y, 0, this.height);
      });
    }
    this.draw(performance.now());
  }

  createParticle(index) {
    const palette = paletteByMode[this.mode];
    const color = hexToRgb(palette[index % palette.length]);
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: 0.8 + Math.random() * 2.1,
      phase: Math.random() * Math.PI * 2,
      speed: 0.7 + Math.random() * 0.7,
      color: { ...color },
      targetColor: { ...color }
    };
  }

  setMode(mode, accent) {
    if (!this.available) return;
    if (!paletteByMode[mode]) mode = "chaos";
    this.mode = mode;
    this.accent = accent || paletteByMode[mode][0];
    const palette = paletteByMode[mode];
    this.particles.forEach((particle, index) => {
      particle.targetColor = hexToRgb(index % 7 === 0 ? this.accent : palette[index % palette.length]);
    });
    if (this.reduced) this.draw(performance.now());
  }

  setReduced(reduced) {
    if (!this.available) return;
    this.reduced = reduced;
    if (reduced) {
      this.stop();
      this.draw(performance.now());
    } else if (!this.scrolling) {
      this.start();
    }
  }

  setScrolling(scrolling) {
    if (!this.available || this.scrolling === scrolling) return;
    this.scrolling = scrolling;
    if (this.reduced) return;
    if (scrolling) this.stop();
    else this.start();
  }

  pulse(x = this.pointer.x, y = this.pointer.y) {
    if (!this.available) return;
    this.pulses.push({ x, y, born: performance.now(), color: hexToRgb(this.accent) });
    if (this.pulses.length > 4) this.pulses.shift();
    if (this.reduced) this.draw(performance.now());
  }

  start() {
    if (!this.available || this.reduced || this.running || this.scrolling || document.hidden) return;
    this.running = true;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.boundAnimate);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  animate(time) {
    if (!this.running) return;
    if (time - this.lastRender >= 32) {
      this.draw(time);
      this.lastRender = time;
    }
    this.frame = requestAnimationFrame(this.boundAnimate);
  }

  getCenter() {
    const narrow = this.width < 880;
    return {
      x: this.width * (narrow ? 0.53 : 0.72),
      y: this.height * (narrow ? 0.43 : 0.5)
    };
  }

  getTarget(index, time) {
    const particleCount = this.particles.length;
    const center = this.getCenter();
    const shortest = Math.min(this.width, this.height);
    const radius = shortest * (this.width < 700 ? 0.28 : 0.34);
    const normalized = index / Math.max(1, particleCount - 1);
    const phase = time * 0.00028;

    if (this.mode === "chaos") return null;

    if (this.mode === "core") {
      const arm = index % 3;
      const angle = normalized * Math.PI * 8 + phase * (arm % 2 ? -1 : 1);
      const spiralRadius = radius * (0.14 + (index % 38) / 44);
      return {
        x: center.x + Math.cos(angle) * spiralRadius,
        y: center.y + Math.sin(angle) * spiralRadius * 0.72
      };
    }

    if (this.mode === "flow") {
      const columns = 5;
      const column = index % columns;
      const row = Math.floor(index / columns);
      const rows = Math.ceil(particleCount / columns);
      const x = center.x - radius + (column / (columns - 1)) * radius * 2;
      const y = center.y - radius * 0.72 + (row / Math.max(1, rows - 1)) * radius * 1.44;
      return { x: x + Math.sin(phase * 3 + row) * 8, y };
    }

    if (this.mode === "gate") {
      const lane = index % 4;
      const progress = (normalized * 3 + phase * 0.8 + lane * 0.11) % 1;
      const gateX = center.x + (progress - 0.5) * radius * 2.25;
      const blocked = index % 9 === 0 && progress > 0.48;
      return {
        x: blocked ? center.x - 22 : gateX,
        y: center.y + (lane - 1.5) * 62 + Math.sin(progress * Math.PI * 3) * 14
      };
    }

    if (this.mode === "scan") {
      const columns = 13;
      const column = index % columns;
      const row = Math.floor(index / columns);
      const rows = Math.ceil(particleCount / columns);
      const scan = (phase * 2.6) % 1;
      const baseY = center.y - radius * 0.72 + (row / Math.max(1, rows - 1)) * radius * 1.44;
      return {
        x: center.x - radius + (column / (columns - 1)) * radius * 2,
        y: baseY + (Math.abs(row / rows - scan) < 0.09 ? Math.sin(time * 0.01 + column) * 13 : 0)
      };
    }

    if (this.mode === "orbit") {
      const group = index % 6;
      const within = Math.floor(index / 6);
      const groupAngle = (group / 6) * Math.PI * 2 + phase;
      const groupX = center.x + Math.cos(groupAngle) * radius * 0.62;
      const groupY = center.y + Math.sin(groupAngle) * radius * 0.45;
      const localAngle = (within / Math.ceil(particleCount / 6)) * Math.PI * 2 - phase * 2;
      const localRadius = 22 + (within % 4) * 5;
      return {
        x: groupX + Math.cos(localAngle) * localRadius,
        y: groupY + Math.sin(localAngle) * localRadius
      };
    }

    if (this.mode === "shock") {
      const ring = index % 5;
      const ringRadius = radius * (0.14 + ring * 0.19) + Math.sin(phase * 7 - ring) * 15;
      const angle = (Math.floor(index / 5) / Math.ceil(particleCount / 5)) * Math.PI * 2;
      return {
        x: center.x + Math.cos(angle) * ringRadius,
        y: center.y + Math.sin(angle) * ringRadius * 0.78
      };
    }

    if (this.mode === "market") {
      const x = center.x - radius * 1.12 + normalized * radius * 2.24;
      const trend = -normalized * radius * 0.62;
      const wave = Math.sin(normalized * Math.PI * 6 + phase * 2) * radius * 0.2;
      const micro = Math.sin(normalized * Math.PI * 21 - phase * 5) * 12;
      return { x, y: center.y + radius * 0.32 + trend + wave + micro };
    }

    if (this.mode === "journal") {
      const columns = 12;
      const column = index % columns;
      const row = Math.floor(index / columns);
      const rows = Math.ceil(particleCount / columns);
      return {
        x: center.x - radius + (column / (columns - 1)) * radius * 2,
        y: center.y - radius * 0.62 + (row / Math.max(1, rows - 1)) * radius * 1.24
      };
    }

    if (this.mode === "kanso") {
      const verticalShare = 0.42;
      if (normalized < verticalShare) {
        const progress = normalized / verticalShare;
        return { x: center.x - radius * 0.42, y: center.y - radius + progress * radius * 2 };
      }
      if (normalized < 0.71) {
        const progress = (normalized - verticalShare) / (0.71 - verticalShare);
        return {
          x: center.x - radius * 0.42 + progress * radius * 1.12,
          y: center.y - progress * radius
        };
      }
      const progress = (normalized - 0.71) / 0.29;
      return {
        x: center.x - radius * 0.42 + progress * radius * 1.12,
        y: center.y + progress * radius
      };
    }

    return null;
  }

  drawModePrimitives(time) {
    const context = this.context;
    const center = this.getCenter();
    const accent = hexToRgb(this.accent);
    const radius = Math.min(this.width, this.height) * (this.width < 700 ? 0.28 : 0.34);

    context.save();
    context.lineWidth = 1;
    context.strokeStyle = rgba(accent, 0.18);

    if (this.mode === "gate") {
      context.strokeRect(center.x - 16, center.y - radius * 0.62, 32, radius * 1.24);
      context.fillStyle = rgba(accent, 0.06);
      context.fillRect(center.x - 16, center.y - radius * 0.62, 32, radius * 1.24);
    }

    if (this.mode === "scan") {
      const scanY = center.y - radius * 0.7 + ((time * 0.00036) % 1) * radius * 1.4;
      const gradient = context.createLinearGradient(center.x - radius, scanY, center.x + radius, scanY);
      gradient.addColorStop(0, rgba(accent, 0));
      gradient.addColorStop(0.5, rgba(accent, 0.65));
      gradient.addColorStop(1, rgba(accent, 0));
      context.strokeStyle = gradient;
      context.beginPath();
      context.moveTo(center.x - radius, scanY);
      context.lineTo(center.x + radius, scanY);
      context.stroke();
    }

    if (this.mode === "orbit") {
      for (let index = 0; index < 3; index += 1) {
        context.beginPath();
        context.ellipse(center.x, center.y, radius * (0.3 + index * 0.2), radius * (0.2 + index * 0.14), 0, 0, Math.PI * 2);
        context.stroke();
      }
    }

    if (this.mode === "shock") {
      const pulse = (time * 0.00038) % 1;
      for (let index = 0; index < 4; index += 1) {
        const ringProgress = (pulse + index / 4) % 1;
        context.strokeStyle = rgba(accent, (1 - ringProgress) * 0.28);
        context.beginPath();
        context.ellipse(center.x, center.y, radius * ringProgress, radius * ringProgress * 0.78, 0, 0, Math.PI * 2);
        context.stroke();
      }
    }

    if (this.mode === "core") {
      context.strokeStyle = rgba(accent, 0.14);
      for (let index = 0; index < 4; index += 1) {
        context.beginPath();
        context.arc(center.x, center.y, radius * (0.18 + index * 0.18), 0, Math.PI * 2);
        context.stroke();
      }
    }

    context.restore();
  }

  draw(time) {
    const context = this.context;
    if (!context || !this.width || !this.height) return;

    const delta = clamp((time - this.lastTime) / 16.67 || 1, 0.25, 2.2);
    this.lastTime = time;
    context.clearRect(0, 0, this.width, this.height);
    context.save();
    context.globalCompositeOperation = "screen";

    const connectionDistance = this.width < 700 ? 72 : 105;
    const pointerRadius = this.width < 700 ? 100 : 165;

    this.particles.forEach((particle, index) => {
      const target = this.getTarget(index, time);
      if (target) {
        particle.vx += (target.x - particle.x) * 0.0075 * delta;
        particle.vy += (target.y - particle.y) * 0.0075 * delta;
      } else {
        particle.vx += Math.sin(time * 0.00036 * particle.speed + particle.phase) * 0.018 * delta;
        particle.vy += Math.cos(time * 0.00029 * particle.speed + particle.phase) * 0.018 * delta;
      }

      if (this.pointer.active) {
        const dx = this.pointer.x - particle.x;
        const dy = this.pointer.y - particle.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance < pointerRadius) {
          const strength = (1 - distance / pointerRadius) * (this.pointer.pressed ? 0.24 : -0.075);
          particle.vx += (dx / distance) * strength * delta;
          particle.vy += (dy / distance) * strength * delta;
        }
      }

      this.pulses.forEach((pulse) => {
        const age = time - pulse.born;
        const pulseRadius = age * 0.38;
        const dx = particle.x - pulse.x;
        const dy = particle.y - pulse.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (Math.abs(distance - pulseRadius) < 38) {
          const force = (1 - Math.abs(distance - pulseRadius) / 38) * 0.34;
          particle.vx += (dx / distance) * force * delta;
          particle.vy += (dy / distance) * force * delta;
        }
      });

      particle.vx *= target ? 0.88 : 0.97;
      particle.vy *= target ? 0.88 : 0.97;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;

      if (!target) {
        if (particle.x < -20) particle.x = this.width + 20;
        if (particle.x > this.width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = this.height + 20;
        if (particle.y > this.height + 20) particle.y = -20;
      }

      particle.color.r += (particle.targetColor.r - particle.color.r) * 0.035;
      particle.color.g += (particle.targetColor.g - particle.color.g) * 0.035;
      particle.color.b += (particle.targetColor.b - particle.color.b) * 0.035;
    });

    for (let first = 0; first < this.particles.length; first += 1) {
      const a = this.particles[first];
      for (let second = first + 1; second < this.particles.length; second += 1) {
        const b = this.particles[second];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared > connectionDistance * connectionDistance) continue;
        const distance = Math.sqrt(distanceSquared);
        const alpha = (1 - distance / connectionDistance) * (this.mode === "chaos" ? 0.11 : 0.18);
        context.strokeStyle = rgba(a.color, alpha);
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }
    }

    this.drawModePrimitives(time);

    context.shadowBlur = 0;
    this.particles.forEach((particle) => {
      context.beginPath();
      context.fillStyle = rgba(particle.color, 0.72);
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    });

    this.pulses = this.pulses.filter((pulse) => time - pulse.born < 1500);
    this.pulses.forEach((pulse) => {
      const age = time - pulse.born;
      const progress = age / 1500;
      context.shadowBlur = 0;
      context.strokeStyle = rgba(pulse.color, (1 - progress) * 0.62);
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(pulse.x, pulse.y, age * 0.38, 0, Math.PI * 2);
      context.stroke();
    });

    context.restore();
  }
}

const signalCanvas = document.getElementById("signal-canvas");
const signalEngine = new SignalEngine(signalCanvas);

const toast = document.getElementById("signal-toast");
let toastTimer = null;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1900);
}

const motionToggle = document.getElementById("motion-toggle");
const mobileMotionToggle = document.getElementById("mobile-motion-toggle");
const motionControls = [motionToggle, mobileMotionToggle].filter(Boolean);
let startCursorAnimation = () => {};
let stopCursorAnimation = () => {};

function syncMotionControl() {
  motionControls.forEach((control) => {
    control.setAttribute("aria-pressed", String(effectsReduced));
    control.querySelector("span:last-child").textContent = effectsReduced ? "Motion reduced" : "Motion on";
  });
}

syncMotionControl();

motionControls.forEach((control) => {
  control.addEventListener("click", () => {
    effectsReduced = !effectsReduced;
    body.classList.toggle("effects-reduced", effectsReduced);
    document.documentElement.classList.toggle("effects-reduced", effectsReduced);
    document.documentElement.classList.toggle("motion-forced", !effectsReduced);
    storeValue("mk-portfolio-motion", effectsReduced ? "reduced" : "full");
    signalEngine.setReduced(effectsReduced);
    if (effectsReduced) stopCursorAnimation();
    else startCursorAnimation();
    syncMotionControl();
    showToast(effectsReduced ? "Motion reduced" : "Motion restored");
  });
});

motionQuery.addEventListener("change", (event) => {
  if (readStoredValue("mk-portfolio-motion") !== null) return;
  effectsReduced = event.matches;
  body.classList.toggle("effects-reduced", effectsReduced);
  document.documentElement.classList.toggle("effects-reduced", effectsReduced);
  document.documentElement.classList.remove("motion-forced");
  signalEngine.setReduced(effectsReduced);
  if (effectsReduced) stopCursorAnimation();
  else startCursorAnimation();
  syncMotionControl();
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const motionRegionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    entry.target.classList.toggle("is-motion-visible", entry.isIntersecting);
  });
}, { threshold: 0.01, rootMargin: "18% 0px 18% 0px" });

document.querySelectorAll(".signal-scene, .project-journey").forEach((region) => {
  region.classList.add("motion-region");
  motionRegionObserver.observe(region);
});

const countObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    const target = Number(element.dataset.count);
    const prefix = element.dataset.prefix || "";
    const suffix = element.dataset.suffix || "";
    if (effectsReduced) {
      element.textContent = `${prefix}${target}${suffix}`;
    } else {
      const start = performance.now();
      const duration = 1100;
      const tick = (time) => {
        const progress = clamp((time - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    observer.unobserve(element);
  });
}, { threshold: 0.65 });

document.querySelectorAll("[data-count]").forEach((element) => countObserver.observe(element));

const themeAccent = {
  ink: "#c8ff35",
  lime: "#4052ff",
  porcelain: "#4052ff",
  violet: "#c8ff35",
  warm: "#ff4f7b",
  cobalt: "#c8ff35"
};

const themeObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  const theme = visible.target.dataset.theme;
  body.dataset.theme = theme;
  if (!visible.target.closest(".project-journey")) {
    document.documentElement.style.setProperty("--scene-accent", themeAccent[theme] || "#c8ff35");
  }
}, { threshold: [0.18, 0.42, 0.68], rootMargin: "-22% 0px -45% 0px" });

document.querySelectorAll(".theme-scene[data-theme]").forEach((section) => themeObserver.observe(section));

const modeObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting && !entry.target.classList.contains("project-chapter"))
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  const mode = visible.target.dataset.mode;
  const accent = themeAccent[visible.target.dataset.theme] || paletteByMode[mode]?.[0];
  signalEngine.setMode(mode, accent);
}, { threshold: [0.12, 0.35, 0.65], rootMargin: "-24% 0px -44% 0px" });

document.querySelectorAll(".signal-scene:not(.project-chapter)").forEach((section) => modeObserver.observe(section));

const stageTitle = document.getElementById("stage-title");
const stageCopy = document.getElementById("stage-copy");
const stageIndex = document.getElementById("stage-index");
const stageStatus = document.getElementById("stage-status");
const stageProgress = document.getElementById("stage-progress-bar");
const stageFrame = document.querySelector(".stage-frame");
const projectChapters = [...document.querySelectorAll(".project-chapter")];
const totalProjects = projectChapters.length;
const totalProjectsLabel = String(totalProjects).padStart(2, "0");
const currentProjectNames = new Set(projectChapters.map((chapter) => chapter.dataset.project));
const storedVisited = readStoredValue("mk-portfolio-visited", "");
const visitedProjects = new Set(storedVisited.split(",").filter((name) => currentProjectNames.has(name)));
const returningProjectCount = visitedProjects.size;
let activeProject = null;
let initialProjectSet = false;

function setActiveProject(chapter, announce = true, markVisited = true) {
  if (!chapter) return;
  const projectChanged = chapter !== activeProject;
  activeProject = chapter;
  projectChapters.forEach((project) => project.classList.toggle("active", project === chapter));

  const projectName = chapter.dataset.project;
  const index = chapter.dataset.index;
  const accent = chapter.dataset.accent;
  const mode = chapter.dataset.mode;
  document.documentElement.style.setProperty("--scene-accent", accent);
  stageTitle.textContent = projectName;
  stageCopy.textContent = chapter.dataset.caption;
  stageIndex.textContent = index;
  stageStatus.textContent = `SYSTEM ${index} / ${totalProjectsLabel}`;
  stageProgress.style.width = `${(Number(index) / totalProjects) * 100}%`;
  stageFrame.dataset.visual = mode;
  signalEngine.setMode(mode, accent);

  if (markVisited) {
    const wasVisited = visitedProjects.has(projectName);
    visitedProjects.add(projectName);
    storeValue("mk-portfolio-visited", [...visitedProjects].join(","));
    if (announce && projectChanged && initialProjectSet && !wasVisited) {
      showToast(`${visitedProjects.size} / ${totalProjects} systems mapped`);
    }
  }
  initialProjectSet = true;
}

const projectObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (visible) {
    body.dataset.theme = "ink";
    setActiveProject(visible.target);
  }
}, { threshold: [0.16, 0.32, 0.55], rootMargin: "-28% 0px -34% 0px" });

projectChapters.forEach((chapter) => {
  projectObserver.observe(chapter);
  chapter.addEventListener("focusin", () => setActiveProject(chapter, false));
  chapter.addEventListener("pointerenter", () => setActiveProject(chapter, false));
});

setActiveProject(projectChapters[0], false, false);

if (returningProjectCount > 0) {
  window.setTimeout(() => showToast(`Welcome back · ${returningProjectCount} / ${totalProjects} systems mapped`), 1400);
}

const signalToggle = document.getElementById("signal-toggle");
let signalOrdered = false;

signalToggle.addEventListener("click", () => {
  signalOrdered = !signalOrdered;
  signalToggle.setAttribute("aria-pressed", String(signalOrdered));
  signalToggle.querySelector("b").textContent = signalOrdered ? "Signal resolved" : "Conduct the signal";
  signalEngine.setMode(signalOrdered ? "core" : "chaos", signalOrdered ? "#c8ff35" : "#8a5cff");
  signalEngine.pulse(window.innerWidth * 0.7, window.innerHeight * 0.45);
  showToast(signalOrdered ? "Noise resolved" : "Noise released");
});

const composerData = {
  context: {
    label: "LAYER 01 / CONTEXT",
    text: "I begin with the actual inputs, users, risks and constraints—not a model looking for a problem.",
    projects: "Proven in WorkflowForge · IncidentForge",
    mode: "flow",
    accent: "#4052ff"
  },
  structure: {
    label: "LAYER 02 / STRUCTURE",
    text: "I turn ambiguous material into typed facts, explicit routes and components that can be inspected.",
    projects: "Proven in SignalBrief · Enterprise AI Assistant",
    mode: "orbit",
    accent: "#8a5cff"
  },
  guardrails: {
    label: "LAYER 03 / GUARDRAILS",
    text: "I design the unsafe, uncertain and human-review paths before the happy path gets impressive.",
    projects: "Proven in VoiceSafeKit · CodeSentry",
    mode: "gate",
    accent: "#ff4f7b"
  },
  evidence: {
    label: "LAYER 04 / EVIDENCE",
    text: "I use evaluation, traces, observability and measurable outcomes to prove the system works outside the demo.",
    projects: "Proven in IncidentForge · Cognizant delivery",
    mode: "shock",
    accent: "#ff7a42"
  }
};

const composer = document.querySelector(".system-composer");
const composerLabel = document.getElementById("composer-label");
const composerText = document.getElementById("composer-text");
const composerProjects = document.getElementById("composer-projects");
const composerOutput = document.getElementById("composer-output");
const composerButtons = [...composer.querySelectorAll("[data-layer]")];

composerButtons.forEach((button, buttonIndex) => {
  button.tabIndex = buttonIndex === 0 ? 0 : -1;
  button.addEventListener("click", () => {
    const layer = button.dataset.layer;
    const data = composerData[layer];
    composer.dataset.activeLayer = layer;
    composerButtons.forEach((item) => {
      item.setAttribute("aria-selected", String(item === button));
      item.tabIndex = item === button ? 0 : -1;
    });
    composerLabel.textContent = data.label;
    composerText.textContent = data.text;
    composerProjects.textContent = data.projects;
    composerOutput.setAttribute("aria-labelledby", button.id);
    document.documentElement.style.setProperty("--scene-accent", data.accent);
    signalEngine.setMode(data.mode, data.accent);
    signalEngine.pulse(window.innerWidth * 0.72, window.innerHeight * 0.5);
  });

  button.addEventListener("keydown", (event) => {
    const supportedKeys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!supportedKeys.includes(event.key)) return;
    event.preventDefault();
    let nextIndex = 0;
    if (event.key === "End") nextIndex = composerButtons.length - 1;
    else if (event.key !== "Home") {
      const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      nextIndex = (buttonIndex + direction + composerButtons.length) % composerButtons.length;
    }
    composerButtons[nextIndex].focus();
    composerButtons[nextIndex].click();
  });
});

const navToggle = document.getElementById("nav-toggle");
const siteNav = document.getElementById("site-nav");
const compactNavQuery = window.matchMedia("(max-width: 1180px)");

function setNavigationOpen(requestedOpen, returnFocus = false) {
  const open = compactNavQuery.matches && requestedOpen;
  const navShouldBeInert = compactNavQuery.matches && !open;
  navToggle.setAttribute("aria-expanded", String(open));
  siteNav.classList.toggle("open", open);
  siteNav.toggleAttribute("inert", navShouldBeInert);
  navToggle.querySelector("span").textContent = open ? "Close" : "Menu";
  if (returnFocus) navToggle.focus();
}

navToggle.addEventListener("click", () => {
  setNavigationOpen(navToggle.getAttribute("aria-expanded") !== "true");
});

siteNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setNavigationOpen(false));
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
    setNavigationOpen(false, true);
  }
});

compactNavQuery.addEventListener("change", () => setNavigationOpen(false));
setNavigationOpen(false);

const progressBar = document.getElementById("page-progress-bar");
const navLinks = [...siteNav.querySelectorAll("a[href^='#']")];
const navSections = navLinks
  .map((link) => ({ link, section: document.querySelector(link.getAttribute("href")) }))
  .filter((item) => item.section);
let scrollTicking = false;
let scrollIdleTimer = 0;

function syncScrollState() {
  const scrollTop = window.scrollY;
  const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollRange > 0 ? scrollTop / scrollRange : 0;
  const activationLine = window.innerHeight * 0.46;

  let active = navSections[0];
  navSections.forEach((item) => {
    if (item.section.getBoundingClientRect().top <= activationLine) active = item;
  });
  const archiveSection = document.getElementById("project-archive");
  const contactSection = document.getElementById("contact");
  const archiveTop = archiveSection.getBoundingClientRect().top;
  const contactTop = contactSection.getBoundingClientRect().top;
  if (archiveTop <= activationLine && contactTop > activationLine) {
    active = navSections.find((item) => item.link.getAttribute("href") === "#work") || active;
  }

  progressBar.style.transform = `scaleX(${progress})`;
  body.classList.toggle("is-scrolled", scrollTop > 20);
  navLinks.forEach((link) => link.classList.toggle("active", active && link === active.link));
  scrollTicking = false;
}

window.addEventListener("scroll", () => {
  signalEngine.setScrolling(true);
  window.clearTimeout(scrollIdleTimer);
  scrollIdleTimer = window.setTimeout(() => signalEngine.setScrolling(false), 240);
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(syncScrollState);
}, { passive: true });

syncScrollState();

const quickDialog = document.getElementById("quick-dialog");
const awardDialog = document.getElementById("award-dialog");
const awardImage = document.getElementById("award-dialog-image");
const awardCaption = document.getElementById("award-dialog-caption");

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  body.classList.add("dialog-open");
}

function closeDialog(dialog) {
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
  if (!quickDialog.open && !awardDialog.open) body.classList.remove("dialog-open");
}

document.querySelectorAll("[data-open-quick]").forEach((button) => {
  button.addEventListener("click", () => openDialog(quickDialog));
});

quickDialog.querySelector("[data-close-dialog]").addEventListener("click", () => closeDialog(quickDialog));
quickDialog.addEventListener("click", (event) => {
  if (event.target === quickDialog) closeDialog(quickDialog);
});
quickDialog.addEventListener("close", () => body.classList.remove("dialog-open"));

document.querySelectorAll("[data-award-src]").forEach((button) => {
  button.addEventListener("click", () => {
    awardImage.src = button.dataset.awardSrc;
    awardImage.alt = button.dataset.awardAlt;
    awardCaption.textContent = button.dataset.awardAlt;
    openDialog(awardDialog);
  });
});

awardDialog.querySelector("[data-close-award]").addEventListener("click", () => closeDialog(awardDialog));
awardDialog.addEventListener("click", (event) => {
  if (event.target === awardDialog) closeDialog(awardDialog);
});
awardDialog.addEventListener("close", () => {
  awardImage.removeAttribute("src");
  body.classList.remove("dialog-open");
});

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() !== "q" || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target.matches("input, textarea, [contenteditable='true']")) return;
  if (!quickDialog.open && !awardDialog.open) openDialog(quickDialog);
});

const repoDescriptions = {
  MohamadKanso: "GitHub profile and public build index",
  WorkflowForge: "Workflow intelligence from messy operational context",
  VoiceSafeKit: "Privacy and safety for local voice assistants",
  CodeSentry: "Local AI code review and auto-fix",
  SignalBrief: "Multi-agent executive research briefings",
  IncidentForge: "RCA evaluation for AI SRE agents",
  odysseus: "Self-hosted AI workspace",
  MurmurX: "Offline voice-driven AI pipeline",
  Dissertation: "Bitcoin time-series ML research",
  DreamSense: "Creative AI interpretations for written dreams",
  "MLT-Journal": "Machine learning and trading journal",
  "ai-workflow-lifecycle": "Visual guide to AI workflow design",
};

const privateProjectPreviews = new Set(["life-orbit-preview"]);

const repoList = document.getElementById("repo-list");
const repoSearch = document.getElementById("repo-search");
const repoSummary = document.getElementById("repo-summary");
const repoExpand = document.getElementById("repo-expand");
const filterButtons = [...document.querySelectorAll("[data-filter]")];
let repositories = [];
let activeFilter = "all";
let archiveExpanded = false;

function normalizeRepository(repository) {
  return {
    name: repository.name,
    description: (repository.description || repoDescriptions[repository.name] || "Public experiment and source code")
      .replace(/\*\*/g, "")
      .trim(),
    language: repository.primaryLanguage?.name || "Mixed",
    url: repository.url,
    homepage: repository.homepageUrl || "",
    updatedAt: repository.updatedAt || ""
  };
}

function renderRepositories() {
  const query = repoSearch.value.trim().toLowerCase();
  const filtered = repositories.filter((repository) => {
    const matchesQuery = !query || `${repository.name} ${repository.description} ${repository.language}`.toLowerCase().includes(query);
    const matchesFilter = activeFilter === "all"
      || (activeFilter === "HTML" ? Boolean(repository.homepage) : repository.language === activeFilter);
    return matchesQuery && matchesFilter;
  });

  const collapsedLimit = window.innerWidth < 621 ? 6 : 10;
  const visible = archiveExpanded || query || activeFilter !== "all" ? filtered : filtered.slice(0, collapsedLimit);
  repoList.replaceChildren();

  visible.forEach((repository) => {
    const link = document.createElement("a");
    link.href = repository.homepage || repository.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.dataset.language = repository.language;

    const title = document.createElement("span");
    title.textContent = repository.name;
    const detail = document.createElement("small");
    detail.textContent = `${repository.language} · ${repository.description}`;
    if (repository.homepage) {
      const demoBadge = document.createElement("em");
      demoBadge.className = "archive-try-now";
      demoBadge.textContent = "TRY IT NOW";
      detail.append(" ", demoBadge);
    }
    const arrow = document.createElement("b");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    link.append(title, detail, arrow);
    repoList.append(link);
  });

  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "archive-empty";
    empty.textContent = "No public build matches that signal yet.";
    repoList.append(empty);
  }

  repoSummary.textContent = `Showing ${visible.length} of ${filtered.length} matching public repositories`;
  const canExpand = !query && activeFilter === "all" && repositories.length > collapsedLimit;
  repoExpand.hidden = !canExpand;
  repoExpand.textContent = archiveExpanded ? "Show the short list" : `Show all ${repositories.length} repositories`;
}

fetch("assets/data/public-repositories.json?v=20260714-3")
  .then((response) => {
    if (!response.ok) throw new Error("Repository archive unavailable");
    return response.json();
  })
  .then((data) => {
    repositories = data
      .filter((repository) => !repository.isArchived && !repository.isPrivate && !privateProjectPreviews.has(repository.name))
      .map(normalizeRepository)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    renderRepositories();
  })
  .catch(() => {
    repoSummary.textContent = "The featured archive is available above; open GitHub for the full live list.";
  });

repoSearch.addEventListener("input", renderRepositories);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    renderRepositories();
  });
});

repoExpand.addEventListener("click", () => {
  archiveExpanded = !archiveExpanded;
  renderRepositories();
});

const replayButton = document.getElementById("replay-signal");
replayButton.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: effectsReduced ? "auto" : "smooth" });
  signalEngine.setMode("chaos", "#8a5cff");
  signalEngine.pulse(window.innerWidth * 0.7, window.innerHeight * 0.45);
});

if (finePointer.matches) {
  const cursor = document.querySelector(".cursor-orbit");
  let cursorX = window.innerWidth / 2;
  let cursorY = window.innerHeight / 2;
  let cursorFrame = 0;
  let cursorRunning = false;

  const renderCursor = () => {
    cursorFrame = 0;
    if (!cursorRunning) return;
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
  };

  const queueCursorRender = () => {
    if (!cursorRunning || cursorFrame) return;
    cursorFrame = requestAnimationFrame(renderCursor);
  };

  window.addEventListener("pointermove", (event) => {
    cursorX = event.clientX;
    cursorY = event.clientY;
    if (!effectsReduced) {
      cursor.classList.add("visible");
      queueCursorRender();
    }
  }, { passive: true });

  window.addEventListener("pointerleave", () => cursor.classList.remove("visible"));

  startCursorAnimation = () => {
    if (cursorRunning || effectsReduced) return;
    cursorRunning = true;
  };

  stopCursorAnimation = () => {
    cursorRunning = false;
    cancelAnimationFrame(cursorFrame);
    cursorFrame = 0;
    cursor.classList.remove("visible", "hovering");
  };

  if (!effectsReduced) startCursorAnimation();

  document.querySelectorAll("a, button, input").forEach((element) => {
    element.addEventListener("pointerenter", () => {
      if (!effectsReduced) cursor.classList.add("hovering");
    });
    element.addEventListener("pointerleave", () => cursor.classList.remove("hovering"));
  });

  document.querySelectorAll(".magnetic").forEach((element) => {
    let rect = null;
    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;

    const renderMagnetic = () => {
      frame = 0;
      if (!rect || effectsReduced) return;
      const x = pointerX - rect.left - rect.width / 2;
      const y = pointerY - rect.top - rect.height / 2;
      element.style.transform = `translate3d(${x * 0.12}px, ${y * 0.12}px, 0)`;
    };

    element.addEventListener("pointerenter", () => {
      rect = element.getBoundingClientRect();
    });
    element.addEventListener("pointermove", (event) => {
      if (effectsReduced) return;
      if (!rect) rect = element.getBoundingClientRect();
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = requestAnimationFrame(renderMagnetic);
    });
    element.addEventListener("pointerleave", () => {
      cancelAnimationFrame(frame);
      frame = 0;
      rect = null;
      element.style.transform = "translate3d(0, 0, 0)";
    });
  });

  document.querySelectorAll(".tilt").forEach((element) => {
    let rect = null;
    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;

    const renderTilt = () => {
      frame = 0;
      if (!rect || effectsReduced) return;
      const x = (pointerX - rect.left) / rect.width - 0.5;
      const y = (pointerY - rect.top) / rect.height - 0.5;
      element.style.transform = `perspective(1000px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg) translateY(-3px)`;
    };

    element.addEventListener("pointerenter", () => {
      rect = element.getBoundingClientRect();
    });
    element.addEventListener("pointermove", (event) => {
      if (effectsReduced) return;
      if (!rect) rect = element.getBoundingClientRect();
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = requestAnimationFrame(renderTilt);
    });
    element.addEventListener("pointerleave", () => {
      cancelAnimationFrame(frame);
      frame = 0;
      rect = null;
      element.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)";
    });
  });
}
