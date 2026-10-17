// Screenshot the hero and every section at desktop and mobile widths.
// usage: node scripts/qa-screens.mjs [url] [outdir]
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.argv[2] || "http://127.0.0.1:4173/";
const out = process.argv[3] || "design/qa";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const sizes = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];
const sections = ["#top", ".thesis", "#work", "#hermes-agent", "#signalbrief", ".more", "#approach", "#experience", ".awards", "#about", "#atlas", "#contact", ".footer"];
for (const s of sizes) {
  const ctx = await browser.newContext({ viewport: { width: s.width, height: s.height }, isMobile: s.isMobile, hasTouch: s.hasTouch, deviceScaleFactor: s.deviceScaleFactor || 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${out}/${s.name}-00-hero.png` });
  // walk the page so every once-only reveal fires
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += Math.round(s.height * 0.6)) {
    await page.mouse.wheel(0, Math.round(s.height * 0.6));
    await page.waitForTimeout(140);
  }
  await page.waitForTimeout(1500);
  const overflow = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth }));
  let i = 1;
  for (const sel of sections) {
    const el = page.locator(sel).first();
    if (!(await el.count())) continue;
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await el.screenshot({ path: `${out}/${s.name}-${String(i++).padStart(2, "0")}-${sel.replace(/[#.]/g, "")}.png` });
  }
  console.log(s.name, JSON.stringify(overflow), errors.length ? "ERRORS: " + errors.join(" | ") : "no console errors");
  await ctx.close();
}
await browser.close();
