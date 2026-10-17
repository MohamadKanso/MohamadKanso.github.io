// Scroll choreography. Loaded only when motion is allowed; destroy() returns
// every element to its natural, fully visible state.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import SplitType from "split-type";

gsap.registerPlugin(ScrollTrigger);

export function initMotion() {
  const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95 });
  lenis.on("scroll", ScrollTrigger.update);
  const raf = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  const splits: SplitType[] = [];
  const ctx = gsap.context(() => {
    // headings rise line by line out of a mask
    document.querySelectorAll<HTMLElement>(".reveal-lines").forEach((el) => {
      const split = new SplitType(el, { types: "lines", lineClass: "line" });
      splits.push(split);
      split.lines?.forEach((line) => {
        const mask = document.createElement("span");
        mask.className = "line-mask";
        line.parentNode!.insertBefore(mask, line);
        mask.appendChild(line);
      });
      gsap.from(split.lines ?? [], {
        yPercent: 105,
        duration: 1.15,
        ease: "expo.out",
        stagger: 0.07,
        scrollTrigger: { trigger: el, start: "top 86%", once: true },
      });
    });

    // hairlines draw across as their section arrives
    gsap.utils.toArray<HTMLElement>(".section-head, .more-head, .ledger > li, .project").forEach((el) => {
      gsap.from(el, {
        "--rule-scale": 0,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    });

    // screenshots wipe open from the top, the image settles inside
    gsap.utils.toArray<HTMLElement>(".shot, .more-list img, .award img").forEach((el) => {
      const img = el.tagName === "IMG" ? el : el.querySelector("img");
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      tl.fromTo(el, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 1.3, ease: "expo.out" });
      if (img && img !== el) tl.from(img, { scale: 1.08, duration: 1.6, ease: "expo.out" }, 0);
    });

    // quiet fade for supporting copy
    gsap.utils
      .toArray<HTMLElement>(
        ".section-note, .thesis-copy p, .project-text > *, .layers li, .ledger > li > *, .about-body, .recognition li, .contact-mail, .more-list li",
      )
      .forEach((el) => {
        gsap.from(el, {
          autoAlpha: 0,
          y: 18,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        });
      });

    // the hero graph drifts slightly slower than the page as you leave it
    gsap.to(".graph-stage", {
      yPercent: -6,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  });

  // re-split headings when the measure changes
  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
  };
  window.addEventListener("resize", onResize);
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return {
    scrollTo(target: string) {
      lenis.scrollTo(target, { offset: -72, duration: 1.4 });
    },
    destroy() {
      window.removeEventListener("resize", onResize);
      ctx.revert();
      splits.forEach((s) => s.revert());
      gsap.ticker.remove(raf);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    },
  };
}
