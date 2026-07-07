const profile = {
  linkedin: "https://www.linkedin.com/in/mohamadkanso/",
  github: "https://github.com/MohamadKanso",
  cv: "assets/cv/mohamad-kanso-data-ai-engineer-cv.pdf"
};

const repoDescriptions = {
  MohamadKanso: "GitHub profile repository for public profile content.",
  Kanso: "Early personal portfolio/profile site repository.",
  MLT_Journal: "Machine learning and trading journal project archive.",
  "MLT-Journal": "Machine learning and trading journal project archive.",
  "Analysis-Prediction-LSTM": "LSTM analysis and prediction notebook project.",
  GradientDescentRegression: "C++ regression implementation exploring gradient descent mechanics.",
  AirbnbPricePrediciton: "Airbnb price prediction modelling project. Repository name preserves the original spelling.",
  FaceMaskDetection: "Computer vision notebook project for face mask detection.",
  LR_NASDAQ: "Linear regression and Nasdaq market-data modelling project.",
  PredictHousePrices: "C++ multilayer perceptron project for house price prediction.",
  Dissertation: "Bitcoin trading bot and financial time-series ML dissertation project.",
  "ai-workflow-lifecycle": "Visual open-source demo for teaching business teams how AI workflows move from messy context to structured execution.",
  "MLT-Journal": "Public trading and machine-learning journal interface."
};

const commandRoutes = {
  help: "overview",
  whoami: "overview",
  profile: "overview",
  skills: "skills",
  stack: "skills",
  experience: "experience",
  projects: "projects",
  repos: "projects",
  awards: "awards",
  cv: "cv",
  resume: "cv",
  dissertation: "projects",
  disso: "projects",
  contact: "contact",
  linkedin: "contact",
  github: "projects"
};

const terminal = document.getElementById("terminal-scroll");
const commandForm = document.getElementById("command-form");
const commandLine = document.getElementById("command-line");
const bootScreen = document.getElementById("boot-screen");

const loaderSteps = [
  "Syncing GitHub profile telemetry",
  "Mapping LLM systems and AI automation",
  "Loading public demos and project stars",
  "Organising awards, CV, and dissertation",
  "Ready"
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createBootAudio() {
  let context = null;
  let master = null;
  let enabled = false;

  const ensure = async () => {
    if (!context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;
      context = new AudioContextClass();
      master = context.createGain();
      master.gain.value = 0.045;
      master.connect(context.destination);
    }
    if (context.state === "suspended") await context.resume();
    enabled = true;
    return true;
  };

  const tone = (frequency, duration = 0.09, type = "sine", delaySeconds = 0, gainValue = 0.75) => {
    if (!enabled || !context || !master) return;
    const start = context.currentTime + delaySeconds;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, frequency * 0.72), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  };

  return {
    async enable() {
      const ok = await ensure();
      if (ok) {
        tone(740, 0.07, "triangle", 0, 0.55);
        tone(1108, 0.1, "sine", 0.06, 0.5);
      }
      return ok;
    },
    step(index) {
      const notes = [392, 494, 587, 659, 784];
      tone(notes[index % notes.length], 0.07, index % 2 ? "triangle" : "sine", 0, 0.44);
    },
    ready() {
      tone(523, 0.1, "triangle", 0, 0.48);
      tone(659, 0.1, "triangle", 0.07, 0.42);
      tone(1046, 0.14, "sine", 0.14, 0.36);
    },
    get enabled() {
      return enabled;
    }
  };
}

async function runBootSequence() {
  if (!bootScreen) {
    document.body.classList.remove("booting");
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const bootAudio = createBootAudio();
  let skipped = false;
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") skipped = true;
  }, { once: true });

  bootScreen.classList.add("soft-loader");
  bootScreen.innerHTML = `
    <div class="boot-card">
      <div class="boot-copy">
        <span class="boot-eyebrow">Deep-space portfolio telemetry</span>
        <h1>Mohamad Kanso</h1>
        <p>Python · GenAI Engineer · LLM Systems · AI Automation</p>
        <div class="boot-progress" aria-hidden="true"><i></i></div>
        <div class="boot-status" aria-live="polite">Syncing GitHub profile telemetry</div>
        <div class="boot-links" aria-hidden="true">
          <span>CV</span>
          <span>Projects</span>
          <span>Awards</span>
          <span>LinkedIn</span>
        </div>
        <button class="boot-sound" type="button" aria-pressed="false">enable sound</button>
      </div>
      <div class="boot-galaxy" aria-hidden="true">
        <div class="boot-orbit orbit-a"></div>
        <div class="boot-orbit orbit-b"></div>
        <div class="boot-orbit orbit-c"></div>
        <span class="boot-core"></span>
        <span class="boot-star s1">RAG</span>
        <span class="boot-star s2">LLM</span>
        <span class="boot-star s3">40%</span>
        <span class="boot-star s4">CV</span>
        <span class="boot-star s5">MLOps</span>
        <div class="boot-telemetry">
          <span>London, UK</span>
          <span>Cognizant AI</span>
          <span>21 public repos</span>
        </div>
      </div>
    </div>
  `;

  const progress = bootScreen.querySelector(".boot-progress i");
  const status = bootScreen.querySelector(".boot-status");
  const soundButton = bootScreen.querySelector(".boot-sound");
  const stepDelay = reducedMotion ? 90 : 680;

  soundButton.addEventListener("click", async (event) => {
    event.stopPropagation();
    const ok = await bootAudio.enable();
    soundButton.textContent = ok ? "sound on" : "sound unavailable";
    soundButton.setAttribute("aria-pressed", ok ? "true" : "false");
    soundButton.classList.toggle("active", ok);
  });

  for (let index = 0; index < loaderSteps.length && !skipped; index += 1) {
    status.textContent = loaderSteps[index];
    progress.style.width = `${((index + 1) / loaderSteps.length) * 100}%`;
    bootAudio.step(index);
    await delay(stepDelay);
  }

  bootAudio.ready();
  document.body.classList.remove("booting");
  bootScreen.classList.add("exit");

  await delay(reducedMotion ? 80 : 420);
  bootScreen.remove();
}

function setClock() {
  const now = new Date();
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(now).replaceAll(":", " : ");
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(now).toUpperCase();
  const timeEl = document.getElementById("clock-time");
  const dateEl = document.getElementById("clock-date");
  timeEl.textContent = time;
  timeEl.dateTime = now.toISOString();
  dateEl.textContent = date;
}

function points(count, height, seed, phase = 0) {
  const width = 220;
  return Array.from({ length: count }, (_, index) => {
    const x = (width / (count - 1)) * index;
    const wave = Math.sin(index * 0.72 + seed + phase) * 9;
    const wave2 = Math.cos(index * 0.31 + seed * 2) * 4;
    const y = height / 2 + wave + wave2;
    return `${x.toFixed(1)},${Math.max(4, Math.min(height - 4, y)).toFixed(1)}`;
  }).join(" ");
}

function seedCharts() {
  const a = document.getElementById("spark-a");
  const b = document.getElementById("spark-b");
  let phase = 0;
  const draw = () => {
    a.setAttribute("points", points(30, 44, 1.3, phase));
    b.setAttribute("points", points(30, 44, 3.9, phase * 0.8));
    phase += 0.06;
  };
  draw();
  setInterval(draw, 900);
}

function jumpTo(id) {
  const target = document.getElementById(id);
  if (!target) return;
  const offset = target.offsetTop - terminal.offsetTop - 8;
  if (terminal.scrollHeight > terminal.clientHeight + 4) {
    terminal.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
  } else {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  document.querySelectorAll("[data-jump]").forEach((el) => {
    el.classList.toggle("active", el.dataset.jump === id);
  });
}

function runCommand(rawInput) {
  const raw = rawInput.trim().toLowerCase();
  if (!raw) return;

  if (raw === "clear") {
    terminal.scrollTo({ top: 0, behavior: "smooth" });
    commandLine.value = "";
    return;
  }

  if (raw === "download cv" || raw === "cv download") {
    window.open(profile.cv, "_blank", "noopener");
    commandLine.value = "";
    return;
  }

  if (raw === "open linkedin" || raw === "linkedin") {
    window.open(profile.linkedin, "_blank", "noopener");
    jumpTo("contact");
    commandLine.value = "";
    return;
  }

  if (raw === "open github" || raw === "github") {
    window.open(profile.github, "_blank", "noopener");
    commandLine.value = "";
    return;
  }

  const route = commandRoutes[raw] || commandRoutes[raw.split(" ")[0]];
  if (route) {
    jumpTo(route);
  } else {
    const line = document.createElement("div");
    line.className = "terminal-line";
    line.textContent = `$ ${raw}: command not found. Try help, projects, awards, cv, linkedin.`;
    terminal.append(line);
    line.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  commandLine.value = "";
}

function bindNavigation() {
  document.querySelectorAll("[data-jump]").forEach((element) => {
    element.addEventListener("click", () => jumpTo(element.dataset.jump));
  });

  commandForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runCommand(commandLine.value);
  });

  commandLine.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runCommand(commandLine.value);
    }
  });
}

function normalizeRepo(repo) {
  const description = repo.description && repo.description.trim()
    ? repo.description.trim().replace(/\*\*/g, "")
    : repoDescriptions[repo.name] || "Public GitHub repository.";

  return {
    name: repo.name,
    language: repo.primaryLanguage?.name || "Mixed",
    description,
    url: repo.url,
    homepage: repo.homepageUrl || "",
    updatedAt: repo.updatedAt
  };
}

async function renderRepos() {
  const archive = document.getElementById("repo-archive");
  try {
    const response = await fetch("assets/data/public-repositories.json?v=20260707-10", { cache: "no-store" });
    const repos = await response.json();
    repos
      .filter((repo) => !repo.isArchived && !repo.isPrivate)
      .map(normalizeRepo)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .forEach((repo) => {
        const row = document.createElement("article");
        row.className = "repo-row";
        const updated = new Intl.DateTimeFormat("en-GB", {
          year: "numeric",
          month: "short"
        }).format(new Date(repo.updatedAt));
        row.innerHTML = `
          <strong>${repo.name}</strong>
          <span>${repo.language}</span>
          <p>${repo.description}</p>
          <div>
            <span>${updated}</span>
            <a href="${repo.url}" target="_blank" rel="noopener">repo</a>
            ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" rel="noopener">html</a>` : ""}
          </div>
        `;
        archive.append(row);
      });
  } catch (error) {
    archive.textContent = "Repository metadata could not be loaded. Use github.com/MohamadKanso for the live archive.";
  }
}

function drawGlobe() {
  const canvas = document.getElementById("globe");
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const containerWidth = canvas.parentElement ? canvas.parentElement.clientWidth : 320;
  const size = Math.max(176, Math.min(286, containerWidth - 24));
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  ctx.scale(dpr, dpr);

  const dots = [];
  for (let lat = -72; lat <= 72; lat += 8) {
    for (let lon = -180; lon < 180; lon += 8) {
      const fade = Math.random() > 0.1;
      if (fade) dots.push({ lat: lat * Math.PI / 180, lon: lon * Math.PI / 180 });
    }
  }

  function render(time) {
    ctx.clearRect(0, 0, size, size);
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.36;
    const rot = time * 0.00018;

    ctx.strokeStyle = "rgba(187, 235, 239, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    dots.forEach((dot, index) => {
      const lon = dot.lon + rot;
      const x3 = Math.cos(dot.lat) * Math.cos(lon);
      const y3 = Math.sin(dot.lat);
      const z3 = Math.cos(dot.lat) * Math.sin(lon);
      if (z3 < -0.38) return;
      const scale = 0.72 + z3 * 0.32;
      const x = cx + x3 * radius * scale;
      const y = cy + y3 * radius * scale;
      const alpha = 0.18 + Math.max(0, z3) * 0.72;
      ctx.fillStyle = `rgba(210, 251, 255, ${alpha})`;
      ctx.fillRect(x, y, index % 11 === 0 ? 2.1 : 1.4, index % 11 === 0 ? 2.1 : 1.4);
    });

    ctx.strokeStyle = "rgba(212, 251, 255, 0.72)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i += 1) {
      const angle = rot * 3 + i * 0.68;
      const start = radius + 18 + (i % 3) * 11;
      const x1 = cx + Math.cos(angle) * start;
      const y1 = cy + Math.sin(angle) * start * 0.72;
      const x2 = cx + Math.cos(angle) * (start + 34);
      const y2 = cy + Math.sin(angle) * (start * 0.72 + 28);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

setClock();
setInterval(setClock, 1000);
seedCharts();
bindNavigation();
renderRepos();
drawGlobe();
runBootSequence();
