const repoDescriptions = {
  MohamadKanso: "GitHub profile repository for public profile content.",
  "MohamadKanso.github.io": "This compact GitHub Pages portfolio for recruiter review.",
  Kanso: "Early personal portfolio/profile site repository.",
  MLT_Journal: "Machine learning and trading journal project archive.",
  "MLT-Journal": "Public trading and machine-learning journal interface.",
  "Analysis-Prediction-LSTM": "LSTM analysis and prediction notebook project.",
  GradientDescentRegression: "C++ regression implementation exploring gradient descent mechanics.",
  AirbnbPricePrediciton: "Airbnb price prediction modelling project. Repository name preserves the original spelling.",
  FaceMaskDetection: "Computer vision notebook project for face mask detection.",
  LR_NASDAQ: "Linear regression and Nasdaq market-data modelling project.",
  PredictHousePrices: "C++ multilayer perceptron project for house price prediction.",
  Dissertation: "Bitcoin trading bot and financial time-series ML dissertation project.",
  "ai-workflow-lifecycle": "Visual open-source demo for teaching business teams how AI workflows move from messy context to structured execution.",
  MurmurX: "Fully local voice AI pipeline covering speech-to-text, LLM inference, and text-to-speech.",
  DreamSense: "Creative dream interpretation app using Hugging Face models, Stable Diffusion, and Google TTS."
};

const curatedHomepages = {
  WorkflowForge: "https://mohamadkanso.github.io/WorkflowForge/",
  VoiceSafeKit: "https://mohamadkanso.github.io/VoiceSafeKit/",
  CodeSentry: "https://mohamadkanso.github.io/CodeSentry/",
  SignalBrief: "https://mohamadkanso.github.io/SignalBrief/",
  "ai-workflow-lifecycle": "https://mohamadkanso.github.io/ai-workflow-lifecycle/",
  "life-orbit-preview": "https://mohamadkanso.github.io/life-orbit-preview/",
  "MLT-Journal": "https://mohamadkanso.github.io/MLT-Journal/",
  odysseus: "https://pewdiepie-archdaemon.github.io/odysseus/"
};

function setLondonTime() {
  const target = document.getElementById("london-time");
  if (!target) return;

  const now = new Date();
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(now);

  target.textContent = `${time} London`;
}

function cleanDescription(value) {
  return (value || "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseRepo(repo) {
  const homepage = repo.homepageUrl || curatedHomepages[repo.name] || "";
  const description = cleanDescription(repo.description) || repoDescriptions[repo.name] || "Public GitHub repository.";

  return {
    name: repo.name,
    language: repo.primaryLanguage?.name || "Mixed",
    description,
    url: repo.url,
    homepage,
    updatedAt: repo.updatedAt,
    stars: repo.stargazerCount || 0
  };
}

function createText(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function createLink(label, href) {
  const link = document.createElement("a");
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = label;
  return link;
}

function renderRepoRow(repo) {
  const row = document.createElement("article");
  row.className = "repo-row";

  const updated = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short"
  }).format(new Date(repo.updatedAt));

  row.append(createText("strong", "", repo.name));
  row.append(createText("span", "repo-meta", `${repo.language} - ${updated} - ${repo.stars} star${repo.stars === 1 ? "" : "s"}`));
  row.append(createText("p", "", repo.description));

  const links = document.createElement("div");
  links.className = "repo-links";
  links.append(createLink("Repo", repo.url));
  if (repo.homepage) links.append(createLink("HTML", repo.homepage));
  row.append(links);

  return row;
}

async function renderArchive() {
  const archive = document.getElementById("repo-archive");
  if (!archive) return;

  try {
    const response = await fetch("assets/data/public-repositories.json?v=20260708-01", { cache: "no-store" });
    const repos = await response.json();
    const publicRepos = repos
      .filter((repo) => !repo.isPrivate && !repo.isArchived)
      .map(normaliseRepo)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const repoCount = document.getElementById("repo-count");
    const demoCount = document.getElementById("demo-count");
    if (repoCount) repoCount.textContent = String(publicRepos.length);
    if (demoCount) {
      demoCount.textContent = String(publicRepos.filter((repo) => repo.homepage && repo.name !== "MohamadKanso.github.io").length);
    }

    archive.replaceChildren(...publicRepos.map(renderRepoRow));
  } catch (error) {
    archive.textContent = "Repository metadata could not be loaded. Use github.com/MohamadKanso for the live archive.";
  }
}

function setupActiveNavigation() {
  const links = Array.from(document.querySelectorAll(".nav-links a[href^='#']"));
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (!links.length || !sections.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    links.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
    });
  }, {
    rootMargin: "-32% 0px -58% 0px",
    threshold: [0.1, 0.2, 0.4]
  });

  sections.forEach((section) => observer.observe(section));
}

function setupProjectFocus() {
  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mx", `${x}%`);
      card.style.setProperty("--my", `${y}%`);
    });
  });
}

setLondonTime();
setInterval(setLondonTime, 60_000);
setupActiveNavigation();
setupProjectFocus();
renderArchive();
