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

function trafficPoints(count, yBase, amp, seed, phase = 0) {
  const width = 320;
  return Array.from({ length: count }, (_, index) => {
    const x = (width / (count - 1)) * index;
    const pulse = index === 2 ? amp * 2.1 : 0;
    const y = yBase + Math.sin(index * 0.8 + seed + phase) * amp + Math.cos(index * 0.38) * 9 + pulse;
    return `${x.toFixed(1)},${Math.max(6, Math.min(174, y)).toFixed(1)}`;
  }).join(" ");
}

function seedCharts() {
  const a = document.getElementById("spark-a");
  const b = document.getElementById("spark-b");
  const ta = document.getElementById("traffic-a");
  const tb = document.getElementById("traffic-b");
  let phase = 0;
  const draw = () => {
    a.setAttribute("points", points(30, 44, 1.3, phase));
    b.setAttribute("points", points(30, 44, 3.9, phase * 0.8));
    ta.setAttribute("points", trafficPoints(18, 104, 18, 2.2, phase));
    tb.setAttribute("points", trafficPoints(18, 112, 11, 5.1, phase * 1.2));
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
    const response = await fetch("assets/data/public-repositories.json", { cache: "no-store" });
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
  const size = Math.max(220, Math.min(320, containerWidth - 20));
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
    const radius = 108;
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
