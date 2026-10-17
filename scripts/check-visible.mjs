// Regression check: no content may stay hidden, whatever way the page is scrolled.
// usage: node scripts/check-visible.mjs [url]
import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:4173/";
const browser = await chromium.launch({ channel: "chrome" });
let failed = 0;

async function audit(page, label) {
  // let lazy images in view load, then walk back through the page like a reader
  await page.waitForTimeout(1800);
  const report = await page.evaluate(async () => {
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y <= H; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    await new Promise((r) => setTimeout(r, 1800));
    const bad = [];
    document.querySelectorAll("main *").forEach((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (!r.height) return;
      const clipped = cs.clipPath && cs.clipPath.includes("100%");
      if (cs.opacity === "0" || cs.visibility === "hidden" || clipped) bad.push(`${el.tagName}.${el.className} "${(el.textContent || "").trim().slice(0, 30)}"`);
    });
    const lines = [...document.querySelectorAll(".line")].filter((l) => getComputedStyle(l).transform !== "none" && !getComputedStyle(l).transform.endsWith(", 0)"));
    const imgs = [...document.querySelectorAll("main img")].filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute("src"));
    return { bad: bad.slice(0, 8), badCount: bad.length, stuckLines: lines.length, unloaded: imgs };
  });
  const ok = !report.badCount && !report.stuckLines && !report.unloaded.length;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`, ok ? "" : JSON.stringify(report));
}

for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  const tag = `${vp.width}px`;

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.keyboard.press("End");
  await audit(page, `${tag} End key`);

  await page.goto(url + "#experience", { waitUntil: "networkidle" });
  await audit(page, `${tag} deep link #experience`);

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  if (vp.width > 980) {
    await page.click('nav a[href="#about"]');
    await audit(page, `${tag} nav click to about`);
  }

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.6));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0));
  await audit(page, `${tag} scrollbar jump down then up`);
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
