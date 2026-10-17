// Scroll choreography. Loaded only when motion is allowed.
//
// Rule: content is visible by default. An element is only put into its
// "before" state if it is below the viewport when motion starts, and a sweep
// on every scroll (including jumps from anchors, keyboard, scrollbar drags and
// scroll restoration) reveals anything that has reached the viewport or is
// already above it. Nothing can be left hidden.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import SplitType from "split-type";

gsap.registerPlugin(ScrollTrigger);

type Reveal = () => void;

export function initMotion() {
  const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95 });
  const raf = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  const pending = new Map<Element, Reveal>();
  const splits: SplitType[] = [];
  const belowFold = (el: Element) => el.getBoundingClientRect().top > window.innerHeight * 0.95;

  // headings rise line by line out of a mask
  document.querySelectorAll<HTMLElement>(".reveal-lines").forEach((el) => {
    if (!belowFold(el)) return;
    const split = new SplitType(el, { types: "lines", lineClass: "line" });
    splits.push(split);
    const lines = split.lines ?? [];
    lines.forEach((line) => {
      const mask = document.createElement("span");
      mask.className = "line-mask";
      line.parentNode!.insertBefore(mask, line);
      mask.appendChild(line);
    });
    // css transitions, not tweens: the reveal must not depend on animation frames
    lines.forEach((line, i) => {
      line.classList.add("rise", "rise-pending");
      line.style.transitionDelay = `${i * 70}ms`;
    });
    pending.set(el, () => lines.forEach((line) => line.classList.remove("rise-pending")));
  });

  // project screenshots wipe open from the top (award images are never animated)
  document.querySelectorAll<HTMLElement>(".shot, .more-list img").forEach((el) => {
    el.classList.add("wipe");
    if (!belowFold(el)) return;
    el.classList.add("wipe-pending");
    pending.set(el, () => el.classList.remove("wipe-pending"));
  });

  // hairlines draw across as their section arrives
  document.querySelectorAll<HTMLElement>(".section-head, .more-head, .ledger > li, .project").forEach((el) => {
    el.classList.add("rule-draw");
    if (!belowFold(el)) return;
    el.classList.add("rule-pending");
    pending.set(el, () => el.classList.remove("rule-pending"));
  });

  function sweep() {
    const line = window.innerHeight * 0.9;
    for (const [el, run] of pending) {
      if (el.getBoundingClientRect().top < line) {
        pending.delete(el);
        run();
      }
    }
  }
  // runs straight from scroll events (cheap: a handful of rect reads)
  const onScroll = () => {
    if (pending.size) sweep();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  lenis.on("scroll", () => {
    ScrollTrigger.update();
    onScroll();
  });
  sweep();
  // belt and braces: whatever happens, nothing stays hidden for long once on screen
  const safety = window.setInterval(() => {
    if (!pending.size) return window.clearInterval(safety);
    sweep();
  }, 700);

  // the hero graph drifts slightly slower than the page as you leave it.
  // decorative only: if it never runs, nothing is hidden.
  const drift = gsap.to(".graph-stage", {
    yPercent: -6,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return {
    scrollTo(target: string) {
      lenis.scrollTo(target, { offset: -72, duration: 1.2 });
    },
    destroy() {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.clearInterval(safety);
      for (const run of pending.values()) run();
      pending.clear();
      document.querySelectorAll(".wipe, .wipe-pending, .rule-draw, .rule-pending, .rise, .rise-pending").forEach((el) =>
        el.classList.remove("wipe", "wipe-pending", "rule-draw", "rule-pending", "rise", "rise-pending"),
      );
      splits.forEach((s) => s.revert());
      drift.scrollTrigger?.kill();
      drift.kill();
      gsap.set(".graph-stage", { clearProps: "transform" });
      gsap.ticker.remove(raf);
      lenis.destroy();
    },
  };
}
