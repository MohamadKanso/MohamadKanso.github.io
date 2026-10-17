// Capture a real first-screen still of every live demo for the project list.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const demos = {
  hermes: "https://mohamadkanso.github.io/hermes-contributions/",
  signalbrief: "https://mohamadkanso.github.io/SignalBrief/",
  incidentforge: "https://mohamadkanso.github.io/IncidentForge/",
  voicesafekit: "https://mohamadkanso.github.io/VoiceSafeKit/",
  codesentry: "https://mohamadkanso.github.io/CodeSentry/",
  workflowforge: "https://mohamadkanso.github.io/WorkflowForge/",
  intentgraph: "https://mohamadkanso.github.io/Intent-Graph-Preview/",
  mltterminal: "https://mlt-terminal-demo.vercel.app/",
  mltjournal: "https://mohamadkanso.github.io/MLT-Journal/",
  lifeorbit: "https://mohamadkanso.github.io/life-orbit-preview/?v=20260714",
  murmurx: "https://mohamadkanso.github.io/MurmurX/",
};
const only = process.argv.slice(2);
const out = "public/assets/shots";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
for (const [name, url] of Object.entries(demos)) {
  if (only.length && !only.includes(name)) continue;
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(3500);
  if (name === "mltjournal") {
    // the overview shows sample performance figures; the portfolio shows the process view instead.
    await page.locator("span.tooltip", { hasText: /^checklist$/i }).first().locator("xpath=..").click({ force: true });
    await page.mouse.move(1100, 300);
    await page.waitForTimeout(1800);
  }
  const file = `${out}/${name}.jpg`;
  await page.screenshot({ path: file, type: "jpeg", quality: 74 });
  execFileSync("sips", ["-Z", "720", file, "--out", `${out}/${name}-720.jpg`], { stdio: "ignore" });
  console.log("captured", name);
}
await browser.close();
