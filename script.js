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

const bootLines = [
  "Welcome to KANZO-OS!",
  "vm_page_bootstrap: 1245000 free pages and 53061 wired pages",
  "portfolio_kernel: loading Mohamad Kanso profile interface",
  "standard timeslicing quantum is 10000 us",
  "KANZOACPICPU: ProcessorId=1 LocalApicId=0 AI_PIPELINE Enabled",
  "KANZOACPICPU: ProcessorId=2 LocalApicId=2 RAG_INDEX Enabled",
  "KANZOACPICPU: ProcessorId=3 LocalApicId=1 AGENT_RUNTIME Enabled",
  "KANZOACPICPU: ProcessorId=4 LocalApicId=3 DATA_PIPELINES Enabled",
  "calling mpo_policy_init for RecruiterSafeMode",
  "Security policy loaded: source-grounded portfolio routes",
  "calling mpo_policy_init for PublicArtifacts",
  "Security policy loaded: CV, awards, dissertation, GitHub demos",
  "HN_ Evidence framework successfully initialized",
  "using 21 public repositories and 8 hosted HTML demos",
  "[ portfolio configuration begin ]",
  "profile: Mohamad Kanso / Python, Data and AI Engineer",
  "origin: London, UK",
  "current: Cognizant - Artificial Intelligence and Analytics",
  "focus: LLM applications, AI agents, RAG, automation",
  "impact: 40% data-latency reduction across 50M-record pipelines",
  "[ portfolio configuration end ]",
  "com.kanzo.cv.packet load succeeded",
  "com.kanzo.awards.vault load succeeded",
  "com.kanzo.dissertation.report load succeeded",
  "com.kanzo.github.archive load succeeded",
  "com.kanzo.linkedin.route load succeeded",
  "IOPortfolioInterface::linkStatus - public site online",
  "AirPort_Portfolio: Link Up on github.io",
  "DSMOS has arrived",
  "Portfolio Complete"
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function bootDelay(index, reducedMotion) {
  if (reducedMotion) return 20;
  if (index === 2 || index === 4) return 420;
  if (index > 4 && index < 13) return 34;
  if (index === 15 || index === 22) return 260;
  if (index >= bootLines.length - 3) return 220;
  return 24;
}

async function runBootSequence() {
  if (!bootScreen) {
    document.body.classList.remove("booting");
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const log = document.createElement("div");
  log.className = "boot-log";
  bootScreen.append(log);

  let skipped = false;
  const skip = () => { skipped = true; };
  bootScreen.addEventListener("click", skip, { once: true });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" || event.key === "Enter" || event.key === " ") skipped = true;
  }, { once: true });

  for (let index = 0; index < bootLines.length && !skipped; index += 1) {
    if (index === 2) {
      const kernel = document.createElement("span");
      kernel.className = "boot-line dim";
      kernel.textContent = `KANZO-OS Kernel version 2026.07 boot at ${new Date().toString()}; root:github-pages/RELEASE_X86_64`;
      log.append(kernel);
    }

    const line = document.createElement("span");
    line.className = `boot-line ${index === bootLines.length - 1 ? "ok" : ""}`;
    line.textContent = bootLines[index];
    log.append(line);
    bootScreen.scrollTop = bootScreen.scrollHeight;
    await delay(bootDelay(index, reducedMotion));
  }

  await showBootTitle(reducedMotion);
}

async function showBootTitle(reducedMotion) {
  const fast = 1;
  bootScreen.textContent = "";
  bootScreen.classList.add("center");

  await delay(360 * fast);

  const title = document.createElement("h1");
  title.className = "boot-title";
  title.dataset.title = "KANZO-OS";
  title.textContent = "KANZO-OS";
  bootScreen.append(title);

  await delay(220 * fast);
  title.classList.add("fill");

  await delay(300 * fast);
  title.classList.remove("fill");
  title.classList.add("boxed");

  await delay(120 * fast);
  title.classList.remove("boxed");
  title.classList.add("glitch");

  await delay(980 * fast);
  title.classList.remove("glitch");
  title.classList.add("boxed");

  await delay(780 * fast);
  document.body.classList.remove("booting");
  bootScreen.classList.add("exit");

  await delay(380 * fast);
  bootScreen.remove();
}

function setClock() {
  const now = new Date();
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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

function seedMemoryGrid() {
  const grid = document.querySelector(".memory-grid");
  for (let i = 0; i < 190; i += 1) {
    const cell = document.createElement("i");
    if ((i % 7 === 0) || (i % 13 === 0) || i > 168) cell.classList.add("dim");
    grid.append(cell);
  }
}

function jumpTo(id) {
  const target = document.getElementById(id);
  if (!target) return;
  const offset = target.offsetTop - terminal.offsetTop - 8;
  terminal.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
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
    const response = await fetch("assets/data/public-repositories.json?v=20260707-5", { cache: "no-store" });
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

function animatePing() {
  const ping = document.getElementById("ping-value");
  setInterval(() => {
    const value = 12 + Math.floor(Math.random() * 12);
    ping.textContent = `${value}ms`;
  }, 1800);
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
seedMemoryGrid();
seedCharts();
bindNavigation();
renderRepos();
animatePing();
drawGlobe();
runBootSequence();
