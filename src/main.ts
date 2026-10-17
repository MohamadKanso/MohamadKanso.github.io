import "./styles.css";
import { initGraph } from "./graph";

const root = document.documentElement;
const motionOn = () => root.classList.contains("motion-on");

// ------------------------------------------------------------ hero graph
const graph = initGraph(motionOn);

// ------------------------------------------------------------ motion
type MotionApi = { destroy(): void; scrollTo(target: string): void };
let motionApi: MotionApi | null = null;

async function startMotion() {
  if (motionApi || !motionOn()) return;
  const { initMotion } = await import("./motion");
  if (!motionOn()) return;
  motionApi = initMotion();
}
function stopMotion() {
  motionApi?.destroy();
  motionApi = null;
}

const toggle = document.getElementById("motion-toggle") as HTMLButtonElement;
function syncToggle() {
  toggle.setAttribute("aria-pressed", String(!motionOn()));
  toggle.innerHTML = `motion <b>${motionOn() ? "on" : "off"}</b>`;
  toggle.setAttribute("aria-label", motionOn() ? "Turn motion off" : "Turn motion on");
}
function setMotion(on: boolean, remember: boolean) {
  root.classList.toggle("motion-on", on);
  root.classList.toggle("motion-off", !on);
  if (remember) {
    try {
      localStorage.setItem("mk-motion", on ? "on" : "off");
    } catch {
      /* preferences are optional */
    }
  }
  syncToggle();
  graph.setMotion(on);
  if (on) startMotion();
  else stopMotion();
}
toggle.addEventListener("click", () => setMotion(!motionOn(), true));
matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem("mk-motion");
  } catch {
    /* ignore */
  }
  if (!stored) setMotion(!e.matches, false);
});
syncToggle();
// motion code loads after first paint so it never competes with the hero
if (motionOn()) {
  const go = () => startMotion();
  if ("requestIdleCallback" in window) (window as any).requestIdleCallback(go, { timeout: 1200 });
  else setTimeout(go, 300);
}

// ------------------------------------------------------------ masthead
const masthead = document.getElementById("masthead")!;
let lastY = window.scrollY;
window.addEventListener(
  "scroll",
  () => {
    const y = window.scrollY;
    masthead.classList.toggle("is-scrolled", y > 8);
    const hide = y > lastY && y > 400 && !document.body.classList.contains("dialog-open");
    masthead.classList.toggle("is-hidden", hide && motionOn());
    lastY = y;
  },
  { passive: true },
);
masthead.addEventListener("focusin", () => masthead.classList.remove("is-hidden"));

// smooth anchors go through lenis when it is running
document.addEventListener("click", (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a || !motionApi) return;
  const id = a.getAttribute("href")!;
  if (id.length < 2 || !document.querySelector(id)) return;
  e.preventDefault();
  motionApi.scrollTo(id);
  history.replaceState(null, "", id);
});

// ------------------------------------------------------------ dialogs
function openDialog(d: HTMLDialogElement) {
  d.showModal();
  document.body.classList.add("dialog-open");
}
function wireDialog(d: HTMLDialogElement) {
  d.addEventListener("close", () => document.body.classList.remove("dialog-open"));
  d.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t === d || t.closest("[data-close]")) d.close();
  });
}
const brief = document.getElementById("brief") as HTMLDialogElement;
wireDialog(brief);
document.getElementById("brief-open")!.addEventListener("click", () => openDialog(brief));

const lightbox = document.getElementById("lightbox") as HTMLDialogElement;
const lightImg = document.getElementById("lightbox-img") as HTMLImageElement;
const lightCap = document.getElementById("lightbox-caption")!;
wireDialog(lightbox);
lightbox.addEventListener("close", () => lightImg.removeAttribute("src"));
document.querySelectorAll<HTMLButtonElement>("[data-award]").forEach((b) =>
  b.addEventListener("click", () => {
    lightImg.src = b.dataset.award!;
    lightImg.alt = b.dataset.awardAlt || "";
    lightCap.textContent = b.dataset.awardAlt || "";
    openDialog(lightbox);
  }),
);

// ------------------------------------------------------------ open-source atlas
interface Repo {
  name: string;
  description?: string | null;
  primaryLanguage?: { name: string } | null;
  url: string;
  homepageUrl?: string | null;
  updatedAt?: string;
  isArchived?: boolean;
  isPrivate?: boolean;
}
const repoNotes: Record<string, string> = {
  MohamadKanso: "GitHub profile and public build index",
  WorkflowForge: "Workflow intelligence from messy operational context",
  VoiceSafeKit: "Privacy and safety for local voice assistants",
  CodeSentry: "Local AI code review and auto-fix",
  SignalBrief: "Multi-agent executive research briefings",
  IncidentForge: "RCA evaluation for AI SRE agents",
  MurmurX: "Offline voice-driven AI pipeline",
  Dissertation: "Bitcoin time-series ML research",
  DreamSense: "Creative AI interpretations for written dreams",
  "MLT-Journal": "Trading-journal analytics",
  "ai-workflow-lifecycle": "Visual guide to AI workflow design",
};
// private previews and forks of other people's projects are not shown as my builds.
const hidden = new Set(["life-orbit-preview", "odysseus", "hermes-agent"]);
const repoList = document.getElementById("repo-list")!;
const repoSearch = document.getElementById("repo-search") as HTMLInputElement;
const repoSummary = document.getElementById("repo-summary")!;
const repoExpand = document.getElementById("repo-expand") as HTMLButtonElement;
const filters = [...document.querySelectorAll<HTMLButtonElement>("[data-filter]")];
let repos: { name: string; desc: string; lang: string; url: string; live: string; updated: string }[] = [];
let filter = "all";
let expanded = false;

function renderRepos() {
  const q = repoSearch.value.trim().toLowerCase();
  const matches = repos.filter((r) => {
    const okQ = !q || `${r.name} ${r.desc} ${r.lang}`.toLowerCase().includes(q);
    const okF = filter === "all" || (filter === "live" ? Boolean(r.live) : r.lang === filter);
    return okQ && okF;
  });
  const limit = window.innerWidth < 600 ? 6 : 10;
  const shown = expanded || q || filter !== "all" ? matches : matches.slice(0, limit);
  repoList.replaceChildren(
    ...shown.map((r) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = r.live || r.url;
      a.target = "_blank";
      a.rel = "noopener";
      const name = document.createElement("span");
      name.textContent = r.name;
      const small = document.createElement("small");
      small.textContent = `${r.lang.toLowerCase()} · ${r.desc}`;
      if (r.live) {
        const em = document.createElement("em");
        em.textContent = " · live";
        small.append(em);
      }
      a.append(name, small);
      li.append(a);
      return li;
    }),
  );
  if (!shown.length) {
    const li = document.createElement("li");
    li.className = "repos-empty";
    li.textContent = "nothing in the archive matches that yet.";
    repoList.append(li);
  }
  repoSummary.textContent = `showing ${shown.length} of ${matches.length} public repositories`;
  repoExpand.hidden = !(!q && filter === "all" && repos.length > limit);
  repoExpand.textContent = expanded ? "show the short list" : `show all ${repos.length} repositories`;
}
fetch("/data/public-repositories.json")
  .then((r) => (r.ok ? r.json() : Promise.reject()))
  .then((data: Repo[]) => {
    repos = data
      .filter((r) => !r.isArchived && !r.isPrivate && !hidden.has(r.name))
      .map((r) => ({
        name: r.name,
        desc: (r.description || repoNotes[r.name] || "public experiment and source code").replace(/\*\*/g, "").trim(),
        lang: r.primaryLanguage?.name || "Mixed",
        url: r.url,
        live: r.homepageUrl || "",
        updated: r.updatedAt || "",
      }))
      .sort((a, b) => b.updated.localeCompare(a.updated));
    renderRepos();
  })
  .catch(() => {
    repoSummary.textContent = "the featured repositories are above; open github for the full live list.";
  });
repoSearch.addEventListener("input", renderRepos);
repoExpand.addEventListener("click", () => {
  expanded = !expanded;
  renderRepos();
});
filters.forEach((b) =>
  b.addEventListener("click", () => {
    filter = b.dataset.filter!;
    filters.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderRepos();
  }),
);
